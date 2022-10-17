import {User} from "./users.model.js";

export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const result = await user.save();

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
    });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: "No user found",
    });
  }
};
