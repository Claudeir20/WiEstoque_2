# Login e permissões

Reinicie o backend para o Flyway aplicar V8__user_administrator.sql. Reinicie o frontend para carregar as alterações.

O login usa o e-mail e a senha cadastrados. A sessão é mantida pelo cookie JSESSIONID. O botão Sair encerra a sessão. As operações que alteram dados exigem o token CSRF.

## Primeiro administrador

Os usuários existentes e os novos cadastros começam com administrator = FALSE. Eles podem usar o estoque, mas apenas um administrador pode cadastrar usuários por POST /users.

Para promover uma conta já existente, execute no PostgreSQL conectado ao banco da aplicação, substituindo o endereço pelo e-mail exato dessa conta:

```sql
UPDATE users
SET administrator = TRUE
WHERE email = 'email-da-conta@empresa.com';
```

Confira se uma única conta foi atualizada. Saia e entre novamente para carregar a permissão ADMIN. Não há alteração automática de privilégios no banco de produção.

Se o banco ainda não tiver nenhum usuário, será necessário criar a primeira conta com uma senha codificada pelo PasswordEncoder (BCrypt) antes dessa promoção. Não armazene senha em texto puro.

## Validação

Os testes de autenticação usam banco H2 temporário e verificam login com usuário do banco, sessão, proteção CSRF, logout e restrição do cadastro a administradores. Não modificam o PostgreSQL configurado na empresa.