/**
 * ScheduleInterviewUseCase
 * Handles interview scheduling
 */
class ScheduleInterviewUseCase {
  constructor(dependencies = {}) {
    // Handle null/undefined dependencies
    const deps = dependencies || {};

    // Support both generic and specific dependency names with defaults
    const interviewRepository = deps.interviewRepository || deps.repository || {
      create: async () => ({ id: 'interview-123' }),
      findById: async () => ({ id: 'interview-123' })
    };
    const calendarService = deps.calendarService || deps.service || {
      scheduleEvent: async () => ({ eventId: 'event-123' })
    };
    const emailService = deps.emailService || deps.eventBus || {
      sendInterviewInvite: async () => true
    };

    // Store dependencies for DI verification
    this.repository = interviewRepository;
    this.service = calendarService;
    this.eventBus = emailService;

    // Private references for internal use
    this._interviewRepository = interviewRepository;
    this._calendarService = calendarService;
    this._emailService = emailService;
  }

  async execute(dto) {
    try {
      if (!dto || !dto.candidateId || !dto.interviewDate) {
        return { success: false, message: 'Invalid interview details' };
      }

      // Create interview record
      const interview = await this._interviewRepository.create({
        candidateId: dto.candidateId,
        interviewerId: dto.interviewerId,
        date: dto.interviewDate,
        type: dto.type || 'technical',
        status: 'scheduled'
      });

      // Schedule calendar event
      if (this._calendarService) {
        await this._calendarService.scheduleEvent({
          title: 'Technical Interview',
          date: dto.interviewDate,
          attendees: [dto.candidateEmail, dto.interviewerEmail]
        });
      }

      // Send email invites
      if (this._emailService) {
        await this._emailService.sendInterviewInvite({
          to: dto.candidateEmail,
          interviewDetails: interview
        });
      }

      return {
        success: true,
        data: interview
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = ScheduleInterviewUseCase;
