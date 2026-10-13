# Publicação na AWS

Este guia publica o WiEstoque em uma conta AWS no plano gratuito: a aplicação roda em uma **EC2** com Docker, atrás do **Caddy** (HTTPS automático), e os dados ficam em um **PostgreSQL no RDS**. Os arquivos usados estão na pasta [`aws/`](../aws).

**navegador → Caddy (HTTPS, porta 443) → WiEstoque (porta 8080) → RDS PostgreSQL**

O HTTPS é obrigatório: no perfil `prod`, o cookie de sessão só é enviado por HTTPS, e sem ele o login não funciona.

> Os passos seguem também três atividades do painel "Earn AWS credits" do console (orçamento, RDS e EC2). Confira no painel se cada uma foi marcada como concluída.

## 1. Orçamento de custos

Faça antes de criar qualquer recurso.

1. No console, abra **Billing and Cost Management > Budgets > Create budget**.
2. Escolha o modelo **Zero spend budget** ou um **Monthly cost budget** de US$ 5.
3. Informe seu e-mail para os alertas e crie.

## 2. Região

Escolha uma região e use a mesma em todos os passos (canto superior direito do console). **US East (Ohio)** ou **US East (N. Virginia)** funcionam bem; **South America (São Paulo)** tem latência menor, mas é mais cara e consome os créditos mais rápido.

## 3. Grupos de segurança

Em **EC2 > Security Groups > Create security group**, crie dois grupos na VPC padrão:

| Nome | Regras de entrada |
| --- | --- |
| `wiestoque-app` | SSH (22) somente de **My IP**; HTTP (80) e HTTPS (443) de `0.0.0.0/0` |
| `wiestoque-db` | PostgreSQL (5432) com origem no grupo `wiestoque-app` |

Assim o banco só aceita conexões vindas da EC2.

## 4. Banco no RDS

Em **RDS > Create database**:

1. **Standard create**, mecanismo **PostgreSQL** (versão 17).
2. Modelo **Free tier** (ou **Sandbox**/**Dev/Test** com as opções abaixo).
3. Identificador: `wiestoque-db`. Usuário mestre: `wiestoque`. Defina uma senha forte e guarde-a.
4. Instância: **db.t4g.micro** (ou db.t3.micro). Armazenamento: **20 GB gp3**, sem autoscaling.
5. **Single-AZ** (sem Multi-AZ, que dobra o custo).
6. Conectividade: **Public access = No**; grupo de segurança `wiestoque-db` (remova o `default`).
7. Desative **Performance Insights** e **Enhanced monitoring**.
8. Em **Additional configuration**, preencha **Initial database name** com `wiestoque`. Mantenha os backups automáticos (7 dias).
9. Crie e aguarde o status **Available**. Copie o **Endpoint** em **Connectivity & security**.

## 5. Servidor na EC2

Em **EC2 > Launch instance**:

1. Nome `wiestoque-app`, imagem **Ubuntu Server 24.04 LTS**.
2. Tipo **t3.micro** (ou t2.micro, o que aparecer como *Free tier eligible*).
3. Crie um **key pair** (`.pem`) e guarde o arquivo.
4. Grupo de segurança existente: `wiestoque-app`.
5. Armazenamento: **20 GB gp3** (o build do Docker não cabe nos 8 GB padrão).
6. Inicie a instância.

Depois, em **EC2 > Elastic IPs > Allocate**, associe um IP elástico à instância. Sem ele, o IP muda a cada reinício e o endereço HTTPS deixa de funcionar. O IPv4 público tem custo por hora, descontado dos créditos.

## 6. Instalar e subir o sistema

Conecte pelo SSH (no PowerShell do Windows):

```powershell
ssh -i .\wiestoque.pem ubuntu@IP_ELASTICO
```

Na EC2:

```bash
git clone https://github.com/Claudeir20/WiEstoque_2.git
cd WiEstoque_2
bash aws/preparar-ec2.sh
exit
```

Se o repositório for privado, o `git clone` pede usuário e um *personal access token* do GitHub no lugar da senha.

Entre de novo pelo SSH e configure as variáveis:

```bash
cd WiEstoque_2/aws
cp .env.exemplo .env
nano .env
```

| Variável | Valor |
| --- | --- |
| `DOMINIO` | IP elástico com traços + `.sslip.io` (ex.: `18-220-10-20.sslip.io`) ou um domínio próprio apontado para o IP |
| `DATABASE_URL` | `jdbc:postgresql://ENDPOINT:5432/wiestoque?sslmode=require` |
| `DATABASE_USER` / `DATABASE_PASSWORD` | Usuário e senha do RDS |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | Só se o banco estiver vazio e você não for migrar os dados (veja [Login e permissões](LOGIN.md)) |

Suba os serviços. O primeiro build leva de 10 a 20 minutos na t3.micro:

```bash
docker compose up -d --build
docker compose logs -f app
```

Quando aparecer `Started StockManagerApplication`, abra `https://DOMINIO` no navegador. O Flyway cria as tabelas na primeira inicialização. Depois de entrar, apague as variáveis `INITIAL_ADMIN_*` do `.env` e rode `docker compose up -d`.

## 7. Migrar os dados do Neon (opcional)

Para levar os dados atuais em vez de começar com o banco vazio, faça isto antes do `docker compose up` do passo 6, com o banco do RDS ainda vazio. Na EC2:

```bash
docker run --rm postgres:17 \
  pg_dump 'postgresql://USUARIO_NEON:SENHA_NEON@HOST_NEON/BANCO_NEON?sslmode=require' \
  --no-owner --no-privileges -Fc > neon.dump

docker run --rm -i -e PGPASSWORD='SENHA_RDS' postgres:17 \
  pg_restore -h ENDPOINT_RDS -U wiestoque -d wiestoque \
  --no-owner --no-privileges < neon.dump
```

Os dados de conexão do Neon estão no painel dele (**Connection details**). O dump inclui a tabela do Flyway, então as migrações não são reaplicadas. Confira as contagens no sistema e apague `neon.dump` da EC2 depois.

Durante a migração, evite lançamentos no sistema do Render; o que for gravado lá depois do dump não vai para a AWS.

## Atualizar a versão

```bash
cd ~/WiEstoque_2
git pull
cd aws
docker compose up -d --build
```

O build roda os testes; se algum falhar, o container atual continua no ar.

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| Build interrompido ou `Killed` | Falta de memória: confira o swap com `swapon --show` |
| Login volta para a tela inicial | Acesso por HTTP ou pelo IP; use `https://DOMINIO` |
| Caddy sem certificado | Portas 80/443 fechadas no grupo `wiestoque-app` ou `DOMINIO` diferente do IP elástico |
| `Connection refused` / timeout no banco | Grupo `wiestoque-db` sem a regra vinda de `wiestoque-app`, ou endpoint errado |
| Datas um dia adiante | `TZ` ausente; o `docker-compose.yml` já define `America/Sao_Paulo` |

Comandos úteis: `docker compose ps`, `docker compose logs --tail=100 app` e `docker compose restart app`.

## Custos e prazo

- O plano gratuito tem prazo e limite de créditos. Ao terminar, a conta é encerrada se não houver upgrade para o plano pago; acompanhe em **Billing > Credits**.
- Faça backup periódico (snapshot manual do RDS ou `pg_dump`) e guarde uma cópia fora da AWS.
- Para pausar sem perder dados, pare a EC2 e o RDS (o RDS religa sozinho após 7 dias parado). Para encerrar tudo, exclua a instância, o banco, os snapshots e libere o IP elástico.
