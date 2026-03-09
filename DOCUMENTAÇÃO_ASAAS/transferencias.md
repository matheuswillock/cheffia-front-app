

# Transferências

Dúvidas frequentes sobre transferências na API do Asaas

# Posso transferir entre minhas contas Asaas? Tem custo?

É possível realizar transferência entre contas Asaas para contas que possuam vínculo entre si, como conta raiz e subconta, ou duas subcontas de mesma conta raiz.

É necessário que você possua o walletId da conta Asaas de destino, informação que é retornada no momento da criação da mesma.

Não há qualquer custo por essas transferências entre contas Asaas, e elas são realizadas de imediato. Caso a autorização de ação crítica esteja habilitada na conta origem, será necessário realizar a validação para efetivação da transferência.

# Estou recebendo um erro HTTP 409 no pedido de transferência. O que significa?

O erro HTTP 409 (Conflict) indica que a solicitação atual conflitou com uma solicitação que já está no Asaas.

Isso significa que você está realizando uma tentativa de transferência idêntica à outra transferência que foi feita nos últimos 15 minutos.

Disponibilizamos esse mecanismo para evitar que você processe transferências duplicadas sem intenção.\
Portanto, caso você realize duas transferências de mesmo valor e para o mesmo destino em um intervalo inferior à 15 minutos, receberá essa exceção na sua resposta.