using Microsoft.AspNetCore.Mvc;
using ComplaintManagementSystem.Services;

namespace ComplaintManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly ChatService _chatService;

        public ChatController(ChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost("send")]
        public IActionResult SendMessage([FromBody] ChatRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Message))
            {
                return BadRequest("Message cannot be empty.");
            }

            var response = _chatService.GetResponse(request.Message);
            return Ok(new { response });
        }
    }

    public class ChatRequest
    {
        public string? Message { get; set; }
    }
}
