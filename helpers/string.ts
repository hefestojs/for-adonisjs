export default class StringHelper {
  static camelCase(name: string, firstLetter = true) {
    const parts = name.split('.')
    if (parts.length > 1) {
      name = parts[1]
    }
    name = name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    name = firstLetter
      ? name.charAt(0).toUpperCase() + name.slice(1)
      : name.charAt(0).toLowerCase() + name.slice(1)
    return name
  }

  static snakeCase(name: string) {
    return name
      .replace('.', '_')
      .split(/(?=[A-Z])/)
      .join('_')
      .toLowerCase()
  }
}
