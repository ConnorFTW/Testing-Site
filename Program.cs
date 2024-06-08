// MyController.cs
using Microsoft.AspNetCore.Mvc;
using System;

namespace YourNamespace.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MyController : ControllerBase
    {
        [HttpGet("doSomething")]
        public IActionResult DoSomething()
        {
            try
            {
                // Your basic C# function logic here
                Console.WriteLine("C# Function Executed!");
                return Ok("C# Function Executed!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
