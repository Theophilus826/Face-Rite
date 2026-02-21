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
  }

  update = (now) => {
    if (!this.enemy || !this.player || this.enemy.currentHealth <= 0 || this.player.currentHealth <= 0) return;

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
  if (!this.lastAttackTime || now - this.lastAttackTime > this.attackCooldown) {

    this.enemy.characterController.attack(false);   // ✅ Play animation

    this.lastAttackTime = now;
  }
};


  moveToPlayer = () => {
    this.enemy.characterController.moveTo(
      this.player.characterBox.position.clone(),
      true
    );
  };

  stop = () => {
    this.enemy.characterController.stop();
  };
}
