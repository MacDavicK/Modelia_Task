/**
    * Generates an AI image based on user prompt
    * @param userId - The authenticated user's ID
    * @param prompt - The text prompt for image generation
    * @param style - Optional style preset
    * @returns Promise<Generation> The created generation record
    * @throws {BadRequestError} If prompt is invalid
    * @throws {UnauthorizedError} If user not found
    */