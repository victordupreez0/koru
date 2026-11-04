namespace LearnOnline.Helpers
{
    // Generates DiceBear "dylan" profile pictures (https://www.dicebear.com/styles/dylan/).
    // The seed is the user's GUID, so every user gets a random-looking but stable avatar,
    // and the frontend can rebuild the same image from the id when a URL isn't returned.
    public static class AvatarHelper
    {
        public const string BaseUrl = "https://api.dicebear.com/9.x/dylan/svg";

        public static string ForSeed(string seed) => $"{BaseUrl}?seed={Uri.EscapeDataString(seed)}";
    }
}
