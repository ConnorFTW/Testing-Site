using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace BasicWebApp
{
    public class CSharpFunction
    {
        public static async Task Call(HttpContext context)
        {
            context.Response.ContentType = "text/plain";
            await context.Response.WriteAsync("Hello from C#!");
        }
    }
}
