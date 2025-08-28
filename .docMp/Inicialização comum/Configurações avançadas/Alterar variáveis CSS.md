Alterar variáveis CSS
Client-Side

Chave	Opções disponíveis
Propriedade	customization.visual.style.customVariables.{textPrimaryColor, textSecondaryColor, inputBackgroundColor, formBackgroundColor, baseColor, baseColorFirstVariant, baseColorSecondVariant, errorColor, successColor, successSecondaryColor, outlinePrimaryColor, outlineSecondaryColor, buttonTextColor, fontSizeExtraExtraSmall, fontSizeExtraSmall, fontSizeSmall, fontSizeMedium, fontSizeLarge, fontSizeExtraLarge, fontWeightNormal, fontWeightSemiBold, formInputsTextTransform, inputVerticalPadding, inputHorizontalPadding, inputFocusedBoxShadow, inputErrorFocusedBoxShadow, inputBorderWidth, inputFocusedBorderWidth, borderRadiusSmall, borderRadiusMedium, borderRadiusLarge, formPadding}
const customization = {
 visual: {
   style: {
     customVariables: {
       textPrimaryColor: 'string'
       textSecondaryColor: 'string'
     }
   }
 }
};
Importante
Caso precise customizar o estilo visual do Brick para além das customizações de temas e variáveis customizadas, recomendamos que não utilize as classes e ids CSS que são enviadas com os Bricks como referência, visto que são gerados automaticamente durante o processo de build da aplicação e mudam regularmente. Utilize a herança dos elementos HTML para acessar os elementos que necessitar customizar.