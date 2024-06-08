using Microsoft.AspNetCore.Mvc;

namespace TestingSite.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet("/api/doSomething")]
        public IActionResult DoSomething()
        {
            return Ok("C# Function Executed!");
        }
    }
}
