export class EnemyController {
  constructor({
    enemy,
    player,
    BABYLON,
    attackRange = 2,
    aiDamage = 5,
    moveRange = 15,
    attackCooldown = 1
  }) {
    this.enemy = enemy;
    this.player = player;
    this.BABYLON = BABYLON;

    this.attackRange = attackRange;
    this.aiDamage = aiDamage;
    this.moveRange = moveRange;
    this.attackCooldown = attackCooldown;

    this.lastAttackTime = 0;
    this.active = true;

    // Attack hit callback (damage applied mid animation)
    this.enemy.characterController.setAttackHitCallback(() => {
      const { Vector3 } = this.BABYLON;

      const dist = Vector3.Distance(
        this.enemy.enemyBox.position,
        this.player.characterBox.position
      );

      if (dist <= this.attackRange) {
        const dmg = this.player.controller.receiveDamage(this.aiDamage, false);
        this.player.takeDamage?.(dmg);
      }
    });
  }

  update = (time) => {
    if (
      !this.active ||
      !this.enemy ||
      !this.enemy.characterController ||
      this.enemy.currentHealth <= 0
    ) return;

    const { Vector3 } = this.BABYLON;

    // ✅ update character controller movement
    this.enemy.characterController.update();

    const dist = Vector3.Distance(
      this.enemy.enemyBox.position,
      this.player.characterBox.position
    );

    const state = this.enemy.characterController.getState();

    // Attack
    if (dist <= this.attackRange && state !== "Attacking") {
      if (time - this.lastAttackTime > this.attackCooldown) {
        this.enemy.characterController.attack(false);
        this.lastAttackTime = time;
      }
    }

    // Move toward player
    else if (dist <= this.moveRange) {
      if (state !== "Running") {
        this.enemy.characterController.moveTo(
          this.player.characterBox.position.clone(),
          true
        );
      }
    }

    // Stop if too far
    else {
      if (state !== "Idle") {
        this.enemy.characterController.stop();
      }
    }
  };

  stop = () => {
    this.active = false;
    this.enemy?.characterController?.stop();
  };

  dispose = () => {
    this.active = false;
    this.enemy = null;
    this.player = null;
  };
}