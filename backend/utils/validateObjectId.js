import mongoose from "mongoose";

// Every :productId / :id route needs this, otherwise a malformed id throws a
// CastError from Mongoose and surfaces as a 500 instead of the required 400.
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
