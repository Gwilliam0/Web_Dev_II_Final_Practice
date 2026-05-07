import Client from '../models/Client.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { handleHttpError } from '../utils/handleError.js';

// Create a new client
export const create = async (req, res) => {
  const user = req.user; // Get user
  const { name, cif, email, phone, address } = req.body;

  if (!name || !cif || !email) {
    res.status(400).json({ error: 'Missing data' });
    return;
  }
  
  // Check if a client with the same CIF already exists for this user
  const existingClients = await Client.find({ user: user._id });
  if (existingClients.some(c => c.cif === cif)) {
    return res.status(400).json({ error: 'Client with this CIF already exists' });
  }

  const newClient = new Client({
    user: user._id, // Assign user to client
    company: user.company, // Assign company to client
    name,
    cif,
    email,
    phone,
    address
  });

  const io = req.app.get('socketio');
  if (io) {
    io.to(user.company).emit('client:new', newClient);
  }

  await newClient.save();
  res.status(201).json(newClient);
};

// Get all clients created by the user
export const getAll = async (req, res) => {
  try {
    const user = req.user; // Get user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
      
    const { name, sort } = req.query;
    
    let query = { user: user._id, deleted: false };
    
    if (name) {
      query.name = { $regex: name, $options: 'i' }; 
    }

    const [clients, totalItems] = await Promise.all([
      Client.find(query)
        .sort(sort || 'createdAt')
        .skip(skip)
        .limit(limit),
      Client.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems/limit);
    
    res.json({
      totalItems,
      totalPages,
      currentPage: page,
      clients
    });
  } catch (err) {
    handleHttpError(res, 'ERROR_FETCHING_CLIENTS');
  }
};

// Get client by ID, only if it belongs to the user
export const getById = async (req, res) => {
  const user = req.user; // Get user

  const { id } = req.params;
  const client = await Client.findById(id);

  if (!client || client.user.toString() !== user._id.toString()) {
    res.status(404).json({ error: 'Client not found' });
  } else {
    res.json(client);
  }
};

// Update client by ID, only if it belongs to the user
export const update = async (req, res) => {
  const user = req.user; // Get user
  const { id } = req.params;
  const client = await Client.findById(id);

  if (!client || client.user.toString() !== user._id.toString()) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  const { name, cif, email, phone, address } = req.body;
  if (name) client.name = name;
  if (cif) client.cif = cif;
  if (email) client.email = email;
  if (phone) client.phone = phone;
  if (address) client.address = address;

  await client.save();
  res.json(client);
};

// Soft delete client by ID, only if it belongs to the user
export const erase = async (req, res) => {
  try {
    const { soft } = req.query;
    const { id } = req.params;

    if (soft === 'true') {
      await Client.findByIdAndUpdate(id, { deleted: true });
    } else {
      await Client.findByIdAndDelete(id);
    }

    res.json({ message: `Client deleted successfully (${soft === 'true' ? 'soft' : 'hard'})` });
  } catch (err) {
    handleHttpError(res, 'ERROR_DELETING_CLIENT');
  }
};

// Get all archived clients created by the user
export const getAllArchived = async (req, res) => {
  const user = req.user; // Get user

  let result = await Client.find({ user: user._id, deleted: true });
  const { name } = req.query;
  
  if (name) {
    result = result.filter(c => c.name === name);
  }
  
  res.json(result);
};

// Restore a soft-deleted client by ID, only if it belongs to the user
export const restore = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client || client.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Client not found' });
    }

    client.deleted = false;
    await client.save();
    
    res.json({ message: 'Client restored successfully' });
  } catch (err) {
    handleHttpError(res, 'ERROR_RESTORING_CLIENT');
  }
};