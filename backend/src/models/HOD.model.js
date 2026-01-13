import mongoose from 'mongoose';

const hodSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'], 
      trim: true,
      minlength: [1, 'Name cannot be empty']
    },
    designation: { 
      type: String, 
      required: [true, 'Designation is required'], 
      trim: true,
      minlength: [1, 'Designation cannot be empty']
    },
    photo: { 
      type: String, 
      required: [true, 'Photo is required']
    }, // URL or path to image, or base64 data URL
    order: { 
      type: Number, 
      default: 0,
      min: [0, 'Order must be a non-negative number']
    } // For ordering HODs (lower numbers appear first)
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient sorting
hodSchema.index({ order: 1, createdAt: 1 });

export const HOD = mongoose.model('HOD', hodSchema);







