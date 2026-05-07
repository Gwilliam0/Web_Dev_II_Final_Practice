import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User_practice2',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company_practice2',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    cif: {
      type: String,
      required: [true, 'CIF is required'],
      unique: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    phone: {
      type: String,
    },
    address: {
      street: { type: String },
      number: { type: String },
      postal: { type: String },
      city: { type: String },
      province: { type: String },
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

const Client = mongoose.model('Client_practice2', clientSchema);

export default Client;