import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
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

  const userId = new mongoose.Types.ObjectId(user._id);

  try {
    const foundUser = await UserModel.findById(userId).select("messages").lean();

    if (!foundUser) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    const sortedMessages = [...(foundUser.messages ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return Response.json(
      {
        success: true,
        messages: sortedMessages,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("An unexpected error: ", error);
    return Response.json(
      {
        success: false,
        message: "Unexpected error",
      },
      { status: 500 },
    );
  }
}
