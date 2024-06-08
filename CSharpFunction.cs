using System;
using System.Web;

public class CSharpFunction : IHttpHandler {
    public void ProcessRequest(HttpContext context) {
        context.Response.ContentType = "text/plain";
        context.Response.Write("Hello from C#!");
    }

    public bool IsReusable {
        get {
            return false;
        }
    }
}
