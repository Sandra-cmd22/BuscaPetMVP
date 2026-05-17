# 🚀 Testando BuscaPet no Celular em Tempo Real

## ⚡ Como Usar

### 1. Iniciar o Vite (na pasta raiz do projeto)
```bash
npm run dev
```

**O terminal mostrará algo assim:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173
  ➜  Network: http://192.168.x.x:5173
```

### 2. No Celular (mesma rede Wi-Fi)
Abra o navegador e acesse a **Network URL**, exemplo:
```
http://192.168.1.100:5173
```

### 3. Fazer Alterações
- Edite qualquer arquivo no projeto
- A mudança será refletida **automaticamente** no celular (hot reload)
- Sem precisar recarregar página ou fazer commit

---

## 📱 Descobrir o IP Automaticamente (macOS)

### Opção 1: Via Terminal
```bash
# Mostrar apenas o IP local
node scripts/get-local-ip.mjs

# Ou diretamente:
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
```

### Opção 2: Nas Preferências do Sistema
1. **System Preferences** > **Network**
2. Selecione **Wi-Fi**
3. Clique em **Advanced**
4. Copie o endereço de IP

### Opção 3: Verificar no Terminal do Vite
Quando você rodou `npm run dev`, a Network URL já estava lá! 🎯

---

## 🔥 Hot Reload Funcionando?

✅ **Se funciona:**
- Você muda algo no código
- A página do celular atualiza automaticamente
- Sem perder estado (dependendo da mudança)

❌ **Se não funciona:**

### Verificar Firewall (macOS)
```bash
# Se você bloqueou conexões de rede local, desbloqueia:
1. System Preferences > Security & Privacy > Firewall
2. Clique "Firewall Options"
3. Desmarque "Block all incoming connections"
4. Ou adicione a porta 5173 como permitida
```

### Verificar Porta
```bash
# Ver se a porta 5173 está em uso:
lsof -i :5173

# Se estiver bloqueada, usar outra porta:
npm run dev -- --port 3000
```

### Verificar Conectividade
```bash
# Testar se o celular consegue conectar ao Mac:
ping 192.168.x.x  # (do celular, na mesma rede)
```

---

## 🎯 Próximos Passos

1. ✅ Rode `npm run dev` 
2. ✅ Copie a Network URL (ex: `http://192.168.1.100:5173`)
3. ✅ Abra no celular
4. ✅ Edite um arquivo e veja atualizar em tempo real
5. ✅ Sem blocos de rede local!

---

## 📋 Configuração Implementada

- ✅ **vite.config.ts**: Host externo ativado (`host: true`)
- ✅ **HMR configurado**: WebSocket para hot reload funcionar
- ✅ **IP local automático**: Script para descobrir IP
- ✅ **Sem alterações de produção**: Build (`npm run build`) continua igual
- ✅ **Porta 5173**: Padrão do Vite (pode mudar com `--port`)

---

## ⚙️ Configuração Detalhada (vite.config.ts)

```typescript
server: {
  host: true,           // Aceita 0.0.0.0 (todas as interfaces)
  port: 5173,           // Porta padrão
  strictPort: false,    // Se ocupada, usa próxima
  hmr: {
    host: localIP,      // IP automaticamente detectado
    protocol: 'ws',     // WebSocket para hot reload
    port: 5173,
  },
}
```

---

## 🚫 Não Alterar Produção

O build de produção continua normal:
```bash
npm run build
```

As mudanças estão **apenas** em `server.hmr` (configuração de desenvolvimento).

---

**Dúvidas?** Confira os logs do Vite - ele mostra tudo! 🎯
