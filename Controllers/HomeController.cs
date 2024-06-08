using Microsoft.AspNetCore.Mvc;

namespace CSharpApp.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult RunFunction()
        {
            return Content("This is the message from C# File");
        }
    }
}
