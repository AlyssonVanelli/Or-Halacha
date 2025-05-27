# FAQ do Or Halacha

Este arquivo lista as perguntas e respostas exibidas na seção de FAQ da landing page. Para atualizar ou adicionar uma entrada, siga estes passos:

1. Abra o arquivo `/components/FaqAccordion.tsx`.
2. Localize a constante `FAQS: FaqItem[]`.
3. Cada objeto deve ter:
   - `question`: texto da pergunta (string).
   - `answer`: texto da resposta (string).
4. Para inserir uma nova FAQ, adicione um novo objeto ao array.
   ```ts
   {
     question: 'Sua pergunta aqui?',
     answer: 'Sua resposta aqui.',
   }
   ```
