var config = {
    initialBet: { value: 1, type: 'number', label: 'Aposta Inicial' }, // ajuste aqui
    x: { value: 1.95, type: 'number', label: 'Cashout' },
    maxSequence: { value: 6, type: 'number', label: 'Máximo da sequência' },
    maxLoss: { value: -200, type: 'number', label: 'Stop Loss (lucro negativo)' },
    maxProfit: { value: 200, type: 'number', label: 'Meta de Lucro' },
    restartStrategy: {
        value: true, type: 'radio', label: 'Reiniciar após completar?', options: [
            { value: false, label: 'Parar depois' },
            { value: true, label: 'Continuar apostando' }
        ]
    }
};

function main() {
    log.info('🧠 Iniciando estratégia de aposta automática...');

    let sequence = [];
    let currentBet = config.initialBet.value;
    let lossStreak = 0;
    let strategyStarted = false;
    let counter = 0;
    let profit = 0;

    game.onBet = function () {
        counter++;

        if (profit <= config.maxLoss.value) {
            log.error('⛔ Stop Loss atingido. Parando.');
            game.stop();
            return;
        }

        if (profit >= config.maxProfit.value) {
            log.success('🎯 Meta de lucro atingida. Parando.');
            game.stop();
            return;
        }

        log.info(`🎮 Jogo #${counter} | Aposta: ${currentBet.toFixed(2)}`);

        game.bet(currentBet, config.x.value).then(payout => {
            let win = payout >= config.x.value;

            if (win) {
                profit += currentBet * (payout - 1);
                log.success(`✅ Vitória! Lucro: ${profit.toFixed(2)}`);

                if (strategyStarted) sequence.shift();
                else lossStreak = 0;

            } else {
                profit -= currentBet;
                log.error(`❌ Derrota. Lucro atual: ${profit.toFixed(2)}`);

                if (!strategyStarted) {
                    lossStreak++;
                    if (lossStreak >= 2) {
                        sequence = [config.initialBet.value, config.initialBet.value];
                        strategyStarted = true;
                        currentBet = sequence[0] * 2;
                        log.warn('📉 Ativando estratégia de recuperação.');
                    }
                } else {
                    if (sequence.length >= config.maxSequence.value) {
                        log.error('🚨 Sequência máxima atingida. Parando jogo.');
                        game.stop();
                        return;
                    }
                    sequence.push(currentBet);
                }
            }

            // Decidir próxima aposta
            if (strategyStarted) {
                if (sequence.length === 0) {
                    log.success('🏁 Estratégia concluída.');
                    strategyStarted = false;
                    lossStreak = 0;
                    counter = 0;

                    if (!config.restartStrategy.value) {
                        game.stop();
                        return;
                    } else {
                        log.info('🔁 Reiniciando estratégia...');
                    }
                }
                currentBet = sequence.length ? sequence[0] * 2 : config.initialBet.value;
                log.info(`📊 Sequência atual: [${sequence.join(', ')}]`);
            } else {
                currentBet = config.initialBet.value;
            }
        });

        // Delay aleatório (0.5s a 1.5s)
        setTimeout(() => {}, Math.floor(Math.random() * 1000) + 500);
    };
}
