import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ messageid: string }> },
) {
  const { messageid } = await context.params;

  await dbConnect();

  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not authenticated",
      },
      { status: 401 },
    );
  }

  try {
    if (!user._id) {
      return Response.json(
        {
          success: false,
          message: "User id missing in session",
        },
        { status: 401 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(messageid)) {
      return Response.json(
        {
          success: false,
          message: "Invalid message id",
        },
        { status: 400 },
      );
    }

    const messageObjectId = new mongoose.Types.ObjectId(messageid);

    const updateResult = await UserModel.updateOne(
      { _id: user._id, "messages._id": messageObjectId },
      { $pull: { messages: { _id: messageObjectId } } },
    );

    if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Message not found or already deleted",
        },
        { status: 404 },
      );
    }

    return Response.json(
      {
        success: true,
        message: "Message deleted",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting message", error);
    return Response.json(
      {
        success: false,
        message: "Error deleting message",
      },
      { status: 500 },
    );
  }
}
