import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  disconnectSpotify,
  spotifyConfigured,
} from "~/server/integrations/providers/spotify";

export const integrationRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }) => {
    const spotify = await ctx.db.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId: ctx.session.user.id,
          provider: "SPOTIFY",
        },
      },
      select: {
        status: true,
        scopes: true,
        expiresAt: true,
        updatedAt: true,
      },
    });
    return { spotify: { configured: spotifyConfigured(), connection: spotify } };
  }),
  disconnectSpotify: protectedProcedure.mutation(async ({ ctx }) => {
    await disconnectSpotify(ctx.session.user.id);
    return { disconnected: true };
  }),
});
