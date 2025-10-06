import random
import math
import hashlib
from collections import defaultdict

class QLearningAgent:
    """
    Q-Learning Agent với cơ chế tự tạo Q-table từ danh sách actions (recipes).
    """
    def __init__(self, alpha, gamma, epsilon, min_epsilon, decay_rate):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.min_epsilon = min_epsilon
        self.decay_rate = decay_rate
        # q_table[state_hash][action] = q_value
        self.q_table = defaultdict(lambda: defaultdict(float))

    def _hash_state(self, state: dict) -> str:
        raw = str(sorted(state.items()))
        return hashlib.sha256(raw.encode()).hexdigest()

    def ensure_state_actions(self, state: dict, possible_actions: list[int]):
        state_hash = self._hash_state(state)
        for action in possible_actions:
            if action not in self.q_table[state_hash]:
                self.q_table[state_hash][action] = 0.0
        return state_hash

    def choose_action(self, state: dict, possible_actions: list[int]):
        state_hash = self.ensure_state_actions(state, possible_actions)

        # ε-greedy
        if random.uniform(0, 1) < self.epsilon:
            return random.choice(possible_actions)
        else:
            q_values_for_state = self.q_table[state_hash]
            return max(q_values_for_state, key=q_values_for_state.get)

    def get_q(self, state: dict, action: int) -> float:
        state_hash = self._hash_state(state)
        return self.q_table[state_hash].get(action, 0.0)

    def learn(self, state: dict, action: int, reward: float, next_state: dict, next_possible_actions: list[int]):
        state_hash = self.ensure_state_actions(state, [action])
        next_state_hash = self.ensure_state_actions(next_state, next_possible_actions)

        old_q_value = self.q_table[state_hash][action]
        next_max_q = max(self.q_table[next_state_hash].values()) if self.q_table[next_state_hash] else 0.0

        new_q_value = old_q_value + self.alpha * (reward + self.gamma * next_max_q - old_q_value)
        self.q_table[state_hash][action] = new_q_value

        # ✅ Trả về giá trị mới để backend log
        return new_q_value

    def update_epsilon(self, episode: int):
        self.epsilon = self.min_epsilon + (1.0 - self.min_epsilon) * math.exp(-self.decay_rate * episode)
