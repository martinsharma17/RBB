using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using UserManagement.Api.Models;

namespace UserManagement.Api.Tests;

public class AuthorizationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthorizationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SuperAdminRoute_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/superadmin/users");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SuperAdminRoute_WithUserToken_ReturnsForbidden()
    {
        var client = _factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterDto("rolecheck@example.com", "Password1!", "Role Check"));
        var tokens = await register.Content.ReadFromJsonAsync<TokenResponse>();
        var authClient = _factory.CreateClient();
        authClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens!.AccessToken);
        var response = await authClient.GetAsync("/api/superadmin/users");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}

