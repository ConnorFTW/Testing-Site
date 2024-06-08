using System;
using System.Web.Services;

public partial class CSharpFunction : System.Web.UI.Page
{
    [WebMethod]
    public static string GetMessage()
    {
        return "Hello from C# function!";
    }
}
