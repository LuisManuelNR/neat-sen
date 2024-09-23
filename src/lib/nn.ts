// Definimos un nodo y conexión para la red neuronal del agente
class Node {
  id: number
  type: 'input' | 'hidden' | 'output'
  bias: number = Math.random() * 2 - 1; // Inicializamos el bias aleatoriamente

  constructor(id: number, type: 'input' | 'hidden' | 'output') {
    this.id = id
    this.type = type
  }
}

class Connection {
  inNode: Node
  outNode: Node
  weight: number = Math.random() * 2 - 1; // Peso inicial aleatorio entre -1 y 1
  enabled: boolean = true;
  innovationNumber: number

  constructor(inNode: Node, outNode: Node, innovationNumber: number) {
    this.inNode = inNode
    this.outNode = outNode
    this.innovationNumber = innovationNumber
  }
}

// Clase principal del agente (red neuronal)
class Agent {
  nodes: Node[] = [];
  connections: Connection[] = [];
  static innovationCounter: number = 0; // Contador global de innovaciones

  constructor() {
    this.initializeNetwork()
  }

  // Inicializa la red neuronal del agente con una estructura básica (input-output)
  initializeNetwork() {
    // Añadimos nodos de entrada y salida (ajustar el número según el problema)
    const inputNodes = 3  // Por ejemplo, 3 entradas
    const outputNodes = 1 // Por ejemplo, 1 salida

    for (let i = 0; i < inputNodes; i++) {
      this.nodes.push(new Node(i, 'input'))
    }

    for (let i = 0; i < outputNodes; i++) {
      this.nodes.push(new Node(i + inputNodes, 'output'))
    }

    // Añadimos conexiones entre las capas de entrada y salida
    this.nodes.filter(n => n.type === 'input').forEach(inputNode => {
      this.nodes.filter(n => n.type === 'output').forEach(outputNode => {
        this.connections.push(new Connection(inputNode, outputNode, Agent.innovationCounter++))
      })
    })
  }

  // Añadir un nodo en medio de una conexión existente (mutación estructural)
  addNodeMutation() {
    // Elegimos una conexión al azar
    const connectionToSplit = this.connections[Math.floor(Math.random() * this.connections.length)]

    // Deshabilitamos la conexión original
    connectionToSplit.enabled = false

    // Creamos un nuevo nodo en medio de esa conexión
    const newNode = new Node(this.nodes.length, 'hidden')
    this.nodes.push(newNode)

    // Creamos dos nuevas conexiones (entrada -> nuevo nodo y nuevo nodo -> salida)
    this.connections.push(new Connection(connectionToSplit.inNode, newNode, Agent.innovationCounter++))
    this.connections.push(new Connection(newNode, connectionToSplit.outNode, Agent.innovationCounter++))
  }

  // Modificar el peso de una conexión (mutación de parámetros)
  mutateWeights() {
    this.connections.forEach(connection => {
      if (Math.random() < 0.8) {
        // Pequeña variación
        connection.weight += Math.random() * 0.2 - 0.1
      } else {
        // Nuevo valor aleatorio
        connection.weight = Math.random() * 2 - 1
      }
    })
  }
}

// Función de aptitud (fitness) del agente
export const fitnessFunction = (individual: Agent) => {
  // Evaluar el agente según el problema específico
  // Podría ser cómo de bien juega un juego, predicción, etc.
  // Por ejemplo: sumatoria del output con una función de activación
  return individual.nodes.reduce((acc, node) => acc + (node.bias || 0), 0) // Esto es solo un ejemplo
}

// Función para generar un nuevo agente (individuo)
export const generateIndividual = () => new Agent()

// Mutación de un agente (estructura y pesos)
export const mutate = (individual: Agent) => {
  if (Math.random() < 0.05) {
    individual.addNodeMutation() // Mutación estructural
  } else {
    individual.mutateWeights() // Mutación de pesos
  }
  return individual
}

// Cruzar dos agentes (padres) para generar descendencia
export const crossover = (parent1: Agent, parent2: Agent) => {
  const child = new Agent()

  // Combinación de conexiones de los padres
  child.connections = parent1.connections.map(conn => {
    const matchingConn = parent2.connections.find(c => c.innovationNumber === conn.innovationNumber)
    if (matchingConn && Math.random() > 0.5) {
      return { ...matchingConn }
    } else {
      return { ...conn }
    }
  })

  // Fusionamos los nodos de ambos padres
  const nodeIds = new Set([...parent1.nodes.map(n => n.id), ...parent2.nodes.map(n => n.id)])
  child.nodes = Array.from(nodeIds).map(id => {
    return parent1.nodes.find(n => n.id === id) || parent2.nodes.find(n => n.id === id)
  })

  return [child]
}
