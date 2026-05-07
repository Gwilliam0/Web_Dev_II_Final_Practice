import mongoose from 'mongoose';
import { _enum } from 'zod/v4/core';

const deliveryNoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User_practice2',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company_practice2',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client_practice2',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project_practice2',
    },
    description: {
      type: String,
    },
    workDate: {
      type: Date,
    },
    format: {
      type: String,
      required: [true, 'Format is required'],
      enum: ['material', 'hours'],
    },
    // for format 'material'
    material: {
      type: String,
    },
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
    },
    // for format 'hours'
    hours: {
      type: Number,
    },
    workers: [{
      name: { type: String },
      hours: { type: String }
    }],
    // signature
    signed: {
      type: Boolean,
      default: false,
    },
    signedAt: {
      type: Date,
    },
    signatureUrl: {
      type: String,
    },
    pdfUrl: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,   // Añade createdAt y updatedAt
  }
);

const DeliveryNote = mongoose.model('DeliveryNote_practice2', deliveryNoteSchema);

export default DeliveryNote;