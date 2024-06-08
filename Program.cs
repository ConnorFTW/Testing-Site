// MyWebApp/Program.cs
using System;
using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace MyWebApp
{
    class Program
    {
        static void Main(string[] args)
        {
            var host = new WebHostBuilder()
                .UseKestrel()
                .ConfigureServices(services => services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>())
                .Configure(app =>
                {
                    app.Run(context =>
                    {
                        if (context.Request.Path == "/api/doSomething")
                        {
                            // Your basic C# function logic here
                            Console.WriteLine("C# Function Executed!");
                            return context.Response.WriteAsync("C# Function Executed!");
                        }
                        else
                        {
                            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                            return context.Response.WriteAsync("Page not found");
                        }
                    });
                })
                .Build();

            host.Run();
        }
    }
}
