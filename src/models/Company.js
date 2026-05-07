import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User_practice2',
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
    address: {
      street: { type: String },
      number: { type: String },
      postal: { type: String },
      city: { type: String },
      province: { type: String },
    },
    logo: {
        type: String,
    },
    isFreelance: {
        type: Boolean,
        default: false,
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

const Company = mongoose.model('Company_practice2', companySchema);

export default Company;