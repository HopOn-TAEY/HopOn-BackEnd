# Sistema de Autenticação JWT - HopOn

## Configuração

O sistema de autenticação foi migrado de sessões para JWT (JSON Web Tokens). 

### Variáveis de Ambiente

Certifique-se de que a variável `JWT_SECRET` está configurada no seu arquivo `.env`:

```env
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
```

## Como Usar

### 1. Login

**Endpoint:** `POST /login`

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

**Resposta de Sucesso:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "clx123...",
    "nome": "João Silva",
    "email": "usuario@exemplo.com",
    "tipo": "MOTORISTA"
  }
}
```

### 2. Usar o Token

Para acessar rotas protegidas, inclua o token no header `Authorization`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Rotas Protegidas

As seguintes rotas requerem autenticação:

- `GET /me` - Obter informações do usuário autenticado
- `DELETE /deletar-usuario/:id` - Deletar usuário
- `PUT /atualizar-motorista/:id` - Atualizar motorista

### 4. Exemplo de Uso

```bash
# Login
curl -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com", "senha": "senha123"}'

# Usar o token retornado
curl -X GET http://localhost:3333/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## Estrutura do Token

O token JWT contém as seguintes informações:

```json
{
  "id_usuario": "clx123...",
  "email": "usuario@exemplo.com",
  "tipo": "MOTORISTA"
}
```

## Expiração

Os tokens expiram em 7 dias por padrão. Após a expiração, será necessário fazer login novamente.

## Segurança

- O token é assinado com a chave secreta configurada em `JWT_SECRET`
- Nunca compartilhe ou exponha a chave secreta
- Use HTTPS em produção
- Considere implementar refresh tokens para melhor segurança 