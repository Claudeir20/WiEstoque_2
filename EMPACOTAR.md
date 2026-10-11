# Empacotar frontend e backend

Na raiz do projeto, execute no PowerShell com Java 21 e pnpm disponíveis:

```powershell
.\empacotar.ps1
```

O script verifica TypeScript, compila o React com API no mesmo domínio, executa os testes AuthenticationIntegrationTest e gera backend/target/stock-manager-0.0.1-SNAPSHOT.jar. Não executa toda a suíte do backend. O perfil Maven with-frontend inclui frontend/dist em BOOT-INF/classes/static, sem copiar arquivos gerados para src.

Para testar o JAR localmente, configure DB_PASSWORD no terminal (as variáveis configuradas no IntelliJ não são herdadas pelo terminal). Não ative prod ao testar por HTTP:

```powershell
$env:DB_PASSWORD = 'SENHA-DO-BANCO-LOCAL'
java -jar .\backend\target\stock-manager-0.0.1-SNAPSHOT.jar --server.port=8081
```

Abra http://localhost:8081. A porta 8081 permite manter o backend do IntelliJ na 8080. O teste manual acima usa o PostgreSQL local configurado e pode aplicar migrations pendentes. Em banco vazio, configure também INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD antes de iniciar.

A tela de login, JavaScript, CSS e logo são públicos. As APIs permanecem protegidas, com CSRF e cadastro restrito a ADMIN. O frontend em desenvolvimento continua usando o proxy /api do Vite; o frontend empacotado chama /auth, /users e as demais APIs diretamente no mesmo domínio.

Após alterar o frontend, gere novamente o JAR pelo script. A publicação AWS e a configuração HTTPS são etapas seguintes.