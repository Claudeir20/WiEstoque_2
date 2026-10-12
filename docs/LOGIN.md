# Login e permissões

O login usa e-mail e senha. A sessão é mantida pelo cookie JSESSIONID, e o botão Sair encerra a sessão. Operações que alteram dados exigem o token CSRF. Na nuvem, os cookies usam HTTPS.

## Primeiro administrador

Em um banco sem usuários, InitialAdminConfig cria o administrador usando INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD. Configure essas variáveis no ambiente antes da primeira inicialização. A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes em UTF-8; ela é armazenada com BCrypt.

Quando já existe qualquer usuário, a criação inicial não é executada. As variáveis iniciais podem ser removidas depois de confirmar o acesso. Elas não redefinem senhas de contas existentes.

## Cadastro e permissões

Administradores cadastram contas na tela Usuários. Novos usuários possuem acesso ao estoque, mas não recebem permissão de administrador automaticamente. SecurityConfig exige ROLE_ADMIN para /users e ROLE_USER para as demais APIs protegidas.

Para promover uma conta existente, execute no banco correto, substituindo o e-mail:

```sql
UPDATE users
SET administrator = TRUE
WHERE email = 'email-da-conta@empresa.com';
```

Confira que uma única conta foi atualizada. Saia e entre novamente para carregar a permissão.

## Validação

AuthenticationIntegrationTest usa H2 temporário para verificar páginas públicas, autenticação, sessão, CSRF, logout e restrição do cadastro. Não modifica o PostgreSQL operacional.
