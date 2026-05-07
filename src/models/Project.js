import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    notes: {
      type: String,
    },
    projectCode: {
      type: String,
      required: [true, 'Project code is required'],
      unique: true,
    },
    address: {
      street: { type: String },
      number: { type: String },
      postal: { type: String },
      city: { type: String },
      province: { type: String },
    },
    active: {
      type: Boolean,
      default: true,
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

const Project = mongoose.model('Project_practice2', projectSchema);

export default Project;