import { api } from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'
import type { GameState } from '../../types'

export async function getGameState(): Promise<GameState> {
  const { data } = await api.get<GameState>(ENDPOINTS.game.state)
  return data
}
