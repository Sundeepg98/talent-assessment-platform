/**
 * Register User Use Case
 * Application layer - orchestrates domain and infrastructure
 */

class RegisterUserUseCase {
  constructor({ userRepository, emailService, tokenService }) {
    this.userRepository = userRepository;
    this.emailService = emailService;
    this.tokenService = tokenService;
  }

  async execute(dto) {
    const { email, password, name } = dto;
    
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create domain entity
    const user = new (require('../../../domain/identity/entities/User'))(
      null,
      email,
      password,
      { name, isVerified: false }
    );
    
    // Save via repository
    const savedUser = await this.userRepository.save(user);
    
    // Send verification email
    const token = await this.tokenService.generateToken({ userId: savedUser.id });
    await this.emailService.sendVerificationEmail(email, token);
    
    return {
      success: true,
      user: savedUser,
      token
    };
  }
}

module.exports = RegisterUserUseCase;
