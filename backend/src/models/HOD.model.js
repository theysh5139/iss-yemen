import mongoose from 'mongoose';

const hodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    photo: { type: String, required: true }, // URL or path to image
    order: { type: Number, default: 0 } // For ordering HODs
  },
  { timestamps: true }
);

export const HOD = mongoose.model('HOD', hodSchema);



