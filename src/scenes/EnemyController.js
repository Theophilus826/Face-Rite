export class EnemyController {
  constructor({
    enemy,
    player,
    BABYLON,
    attackRange = 2.5,
    aiDamage = 5,
    moveRange = 15,
    attackCooldown = 1.5
  }) {
    this.enemy = enemy;
    this.player = player;
    this.BABYLON = BABYLON;

    this.attackRange = attackRange;
    this.aiDamage = aiDamage;
    this.moveRange = moveRange;
    this.attackCooldown = attackCooldown;

    this.lastAttackTime = 0;
    this.active = true; // ✅ Track if AI is active
  }

  update = (now) => {
    if (
      !this.active ||
      !this.enemy ||
      !this.enemy.characterController ||
      !this.player ||
      this.enemy.currentHealth <= 0 ||
      this.player.currentHealth <= 0
    ) return;

    const { Vector3 } = this.BABYLON;
    const distance = Vector3.Distance(
      this.player.characterBox.position,
      this.enemy.enemyBox.position
    );

    if (distance <= this.attackRange) {
      this.attack(now);
    } else if (distance <= this.moveRange) {
      this.moveToPlayer();
    } else {
      this.stop();
    }
  };

  attack = (now) => {
    if (!this.enemy || !this.enemy.characterController) return;

    if (!this.lastAttackTime || now - this.lastAttackTime > this.attackCooldown) {
      this.enemy.characterController.attack(false); // ✅ Play animation
      this.lastAttackTime = now;
    }
  };

  moveToPlayer = () => {
    if (!this.enemy || !this.enemy.characterController) return;

    this.enemy.characterController.moveTo(
      this.player.characterBox.position.clone(),
      true
    );
  };

  stop = () => {
    if (!this.enemy || !this.enemy.characterController) return;
    this.enemy.characterController.stop();
  };

  // ✅ Stop the AI completely (used when enemy dies)
  dispose = () => {
    this.active = false;
    this.stop();
    this.enemy = null;
    this.player = null;
  };
}
