interface WebpackRequireContext {
  keys(): string[]
  (id: string): { default: React.ComponentType<React.SVGProps<SVGElement>> }
}

declare global {
  interface NodeRequire {
    context(directory: string, useSubdirectories: boolean, regExp: RegExp): WebpackRequireContext
  }

  const require: NodeRequire
}

export { WebpackRequireContext }
