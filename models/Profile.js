const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, required: true, unique: true, index: true },
    gender: { type: String, required: true },
    gender_probability: { type: Number, required: true },
    sample_size: { type: Number, required: true },
    age: { type: Number, required: true },
    age_group: { type: String, required: true },
    country_id: { type: String, required: true },
    country_probability: { type: Number, required: true },
    created_at: { type: String, required: true },
  },
  { _id: false, versionKey: false }
);

profileSchema.set("toJSON", {
  virtuals: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.models.Profile || mongoose.model("Profile", profileSchema);
