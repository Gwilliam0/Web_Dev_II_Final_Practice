import Project from '../models/Project.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import { handleHttpError } from '../utils/handleError.js';

// Create a new project
export const create = async (req, res) => {
  const user = req.user; // Get user
  const { clientId, name, email, notes, projectCode, address, active } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Missing data' });
    return;
  }

  // Check if a projects with the same projectCode already exists
  const existingProjects = await Project.findOne({ projectCode, company: user.company });
  if (existingProjects) {
    return res.status(400).json({ error: 'Project with this code already exists' });
  }

  const client = await Client.findOne({ _id: clientId, company: user.company });
  if (!client) {
    return res.status(404).json({ error: 'Client not found or does not belong to your company' });
  }

  const newProject = new Project({
    user: user._id, // Assign user to project
    company: user.company, // Assign company to project
    client: client._id, // Assign client to project
    name,
    email,
    notes,
    projectCode,
    address,
    active
  });

  const io = req.app.get('socketio');
  if (io) {
    io.to(user.company).emit('project:new', newProject);
  }

  await newProject.save();
  res.status(201).json(newProject);
};

// Get all projects created by the user
export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, client, active, sort } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { company: user.company, deleted: false };
    
    if (name) query.name = { $regex: name, $options: 'i' };
    if (client) query.client = client;
    if (active) query.active = active === 'true';

    const [projects, totalItems] = await Promise.all([
      Project.find(query)
        .populate('client', 'name email')
        .sort(sort || '-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(query)
    ]);

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems/limit),
      currentPage: parseInt(page),
      projects
    });
  } catch (err) {
    handleHttpError(res, 'ERROR_FETCHING_PROJECTS');
  }
};

// Get project by ID, only if it belongs to the user
export const getById = async (req, res) => {
  const user = req.user; // Get user

  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project || project.user.toString() !== user._id.toString()) {
    res.status(404).json({ error: 'Project not found' });
  } else {
    res.json(project);
  }
};

// Update project by ID, only if it belongs to the user
export const update = async (req, res) => {
  const user = req.user; // Get user
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project || project.user.toString() !== user._id.toString()) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const { name, email, notes, projectCode, address, active } = req.body;
  if (name) project.name = name;
  if (email) project.email = email;
  if (notes) project.notes = notes;
  if (projectCode) project.projectCode = projectCode;
  if (address) project.address = address;
  if (typeof active === 'boolean') project.active = active;

  await project.save();
  res.json(project);
};

// Soft delete project by ID, only if it belongs to the user
export const erase = async (req, res) => {
  try {
    const { soft } = req.query;
    const { id } = req.params;

    if (soft === 'true') {
      await Project.findByIdAndUpdate(id, { deleted: true });
    } else {
      await Project.findByIdAndDelete(id);
    }

    res.json({ message: `Project deleted successfully (${soft === 'true' ? 'soft' : 'hard'})` });
  } catch (err) {
    handleHttpError(res, 'ERROR_DELETING_PROJECT');
  }
};

// Get all archived projects created by the user
export const getAllArchived = async (req, res) => {
  const user = req.user; // Get user

  let result = await Project.find({ user: user._id, deleted: true });
  const { name } = req.query;
  
  if (name) {
    result = result.filter(p => p.name === name);
  }
  
  res.json(result);
};

// Restore a soft-deleted project by ID, only if it belongs to the user
export const restore = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project || project.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.deleted = false;
    await project.save();
    
    res.json({ message: 'Project restored successfully' });
  } catch (err) {
    handleHttpError(res, 'ERROR_RESTORING_PROJECT');
  }
};