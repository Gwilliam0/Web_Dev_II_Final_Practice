import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import { errorHandler } from '../utils/handleError.js';
import * as CloudinaryService from '../services/cloudinary.service.js';

// Create a new delivery note
export const create = async (req, res) => {
  try {
    const user = req.user;
    const { project, client, format, description, workDate, material, quantity, unit, hours, workers } = req.body;

    const projectExists = await Project.findOne({ _id: project, company: user.company });
    if (!projectExists) {
      return res.status(404).json({ error: 'Project not found in your company' });
    }

    const newDeliveryNote = new DeliveryNote({
      user: user._id,
      company: user.company,
      project,
      client,
      workDate,
      format,
      description,
      material,
      quantity,
      unit,
      hours,
      workers
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(user.company).emit('deliverynote:new', newDeliveryNote);
    }

    await newDeliveryNote.save();
    res.status(201).json(newDeliveryNote);
  } catch (err) {
    errorHandler(err, req, res, 'ERROR_CREATING_DELIVERY_NOTE');
  }
};

// Get all delivery notes created by the user
export const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, project, client, format, signed, from, to, sort } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { company: req.user.company, deleted: false };

    if (project) query.project = project;
    if (client) query.client = client;
    if (format) query.format = format;
    if (signed) query.signed = signed === 'true';
    if (from || to) {
      query.workDate = {};
      if (from) query.workDate.$gte = new Date(from);
      if (to) query.workDate.$lte = new Date(to);
    }

    const [notes, totalItems] = await Promise.all([
      DeliveryNote.find(query)
        .populate('user', 'name email')
        .populate('client', 'name')
        .populate('project', 'name projectCode')
        .sort(sort || '-workDate')
        .skip(skip)
        .limit(parseInt(limit)),
      DeliveryNote.countDocuments(query)
    ]);

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
      notes
    });
  } catch (err) {
    errorHandler(err, req, res, 'ERROR_FETCHING_DELIVERY_NOTES');
  }
};

// Get delivery note by ID, only if it belongs to the user's company
export const getById = async (req, res) => {
  try {
    const note = await DeliveryNote.findOne({ 
      _id: req.params.id, 
      company: req.user.company 
    }).populate('user client project');

    if (!note) return res.status(404).json({ error: 'Delivery note not found' });

    res.json(note);
  } catch (err) {
    errorHandler(err, req, res, 'ERROR_GETTING_NOTE');
  }
};

// Delete delivery note by ID, only if it belongs to the user's company
export const erase = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await DeliveryNote.findOne({ _id: id, company: req.user.company });
    if (!note) return res.status(404).json({ error: 'Delivery note not found' });
    if(note.signed) return res.status(400).json({ error: 'Cannot delete a signed delivery note' });

    await DeliveryNote.findByIdAndDelete(id);
    res.json({ message: 'Delivery note deleted successfully' });
  } catch (err) {
    errorHandler(err, req, res, 'ERROR_DELETING_DELIVERY_NOTE');
  }
};

// Download PDF of delivery note by ID
export const downloadPdf = async (req, res) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.pdfUrl) {
      return res.redirect(note.pdfUrl);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=albaran-${note._id}.pdf`);
    await generateDeliveryNotePDF(note, res);

    res.status(200).json({ message: 'PDF generated successfully' });
  } catch (err) {
    errorHandler(err, req, res, 'ERROR_DOWNLOADING_PDF');
  }
};

// Sign delivery note by ID
export const sign = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check if note exists
    if (!req.file) {
      return res.status(400).json({ error: 'Signature image is required' });
    }

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadImage(req.file.buffer, {
      folder: 'signatures',
      public_id: `sign_${id}_${Date.now()}`
    });

    const note = await DeliveryNote.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, signed: false },
      { 
        signed: true, 
        signedAt: new Date(),
        signatureUrl: uploadResult.secure_url
      },
      { new: true }
    );

    if(!note) {
      await CloudinaryService.delete(uploadResult.public_id);
      return res.status(400).json({ error: 'Note already signed or not found' });
    }

    // Emit event to notify other users in the same company that a note has been signed
    const io = req.app.get('socketio');
    if (io) {
      io.to(user.company.toString()).emit('deliverynote:signed', note);
    }

    res.json(note);
  } catch (err) {
    errorHandler(err, req, res, 'ERROR_SIGNING_NOTE');
  }
};