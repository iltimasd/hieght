import * as vscode from 'vscode'

// called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor
  let timeout: NodeJS.Timer | undefined = undefined
  const decorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'solid',
    overviewRulerColor: 'blue',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: {
      // used in light color themes
      borderColor: 'darkblue',
    },
    dark: {
      // used in dark color themes
      borderColor: 'lightblue',
    },
    textDecoration: 'double underline overline',
  })

  if (activeEditor) {
    triggerUpdateDecorations()
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor
      if (editor) {
        triggerUpdateDecorations()
      }
    },
    null,
    context.subscriptions,
  )

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations()
      }
    },
    null,
    context.subscriptions,
  )

  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
    timeout = setTimeout(updateDecorations, 500)
  }

  function updateDecorations() {
    if (!activeEditor) {
      return
    }
    let rangesToDecorate: vscode.DecorationOptions[] = []

    check(rangesToDecorate)

    activeEditor.setDecorations(decorationType, rangesToDecorate)
  }

  function check(rangesToDecorate: vscode.DecorationOptions[]) {
    let regex = /hieght/gi
    let hoverMessage = 'Did you mean height?'
    let popupMessage = 'using hieght instead of height'
    genericCheck(regex, hoverMessage, popupMessage, rangesToDecorate)
  }

  function genericCheck(
    regex: RegExp = /^$/,
    hoverMessage: string = '',
    popupMessage: string = '',
    rangesToDecorate: vscode.DecorationOptions[] = [],
  ) {
    if (!activeEditor) {
      return
    }
    const text = activeEditor.document.getText()
    const regexIdVariable = regex // e.g. /if ?\(([^=)]*[iI][dD](?!\.)\b) ?[^=<>\r\n]*?\)/g;
    let match = regexIdVariable.exec(text)
    let errors = []
    let firstLineNumber = null
    while (match) {
      errors.push(match[1])
      if (firstLineNumber == null) {
        firstLineNumber = activeEditor.document.positionAt(match.index).line + 1
      }
      const startPos = activeEditor.document.positionAt(match.index)
      const endPos = activeEditor.document.positionAt(
        match.index + match[0].length,
      )
      const decoration = {
        range: new vscode.Range(startPos, endPos),
        hoverMessage: hoverMessage
          .replace(/\$\{match\[1\]\}/g, match[1])
          .replace(/\$\{match\[2\]\}/g, match[2]), // e.g. `An ID of 0 would evaluate to falsy. Consider: ${match[1]} != null`
      }
      rangesToDecorate.push(decoration)
      match = regexIdVariable.exec(text)
    }
    if (errors.length > 0) {
      // e.g. let popupMessage = `ID of 0 would evaluate to falsy. Consider adding "!= null" for if-statements containing IDs: `;
      vscode.window.showInformationMessage(
        'Line ' +
          firstLineNumber +
          ': ' +
          popupMessage.replace(/\$\{errors.join\(", "\)}/g, errors.join(', ')),
      ) // e.g. popupMessage + errors.join(', '));
    }
  }
}
