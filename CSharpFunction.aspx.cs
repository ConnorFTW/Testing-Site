using System;
using System.Web.Services;

public partial class CSharpFunction : System.Web.UI.Page
{
    [WebMethod]
    [System.Web.Script.Services.ScriptMethod(UseHttpGet = false)] // Ensures that POST requests are accepted
    public static string GetMessage()
    {
        return "Hello from C# function!";
    }
}
