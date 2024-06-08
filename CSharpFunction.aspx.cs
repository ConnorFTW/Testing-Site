using Microsoft.AspNetCore.Mvc;

namespace MyWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        [HttpPost("GetMessage")]
        public ActionResult<string> GetMessage()
        {
            return "Hello from C# function!";
        }
    }
}
