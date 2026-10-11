package dev.mota.stock_manager.controller;


import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {


    @GetMapping("/csrf")
    public CsrfResponse csrf (CsrfToken csrfToken){
        return new CsrfResponse(
                csrfToken.getHeaderName(),
                csrfToken.getToken()
        );
    }

    public record CsrfResponse(
            String headerName,
            String token
    ){}

    @GetMapping("/me")
    public SessionResponse me (java.security.Principal principal){
        return new SessionResponse(principal.getName());
    }

    public record SessionResponse(String email){}
}
