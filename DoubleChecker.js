(function () {
    'use strict';

    let minA;
    let minB;
    let firstA;
    let redRed;
    let blackBlack;
    let maxRoll;
    let minRoll;
    let predicts = [];
    let pastRolls = [];
    let predictsBox;

    // Function to process a single record
    function processRecord(record) {
        const id = record.id;
        const color = record.color;
        const roll = record.roll;
        const created = record.created_at;
        let cor;
        let horaMinuto = new Date(created);
        horaMinuto.setUTCHours(horaMinuto.getUTCHours() - 3); // Adjust time to your local timezone (UTC-3)
        let hora = horaMinuto.getUTCHours();
        let minuto = horaMinuto.getUTCMinutes();

        switch (color) {
            case 0:
                cor = "⚪";
                break;
            case 1:
                cor = "🔴";
                break;
            case 2:
                cor = "⚫";
                break;
        }

        return { id, cor, roll, hora, minuto, horaMinuto };
    }

    // Function to fetch all roulette history
    function fetchRouletteHistory() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", 'https://blaze1.space/api/singleplayer-originals/originals/roulette_games/recent/history/1', true);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    const processedRecords = data.records.map(record => processRecord(record));
                    resolve(processedRecords);
                } else {
                    reject('Error fetching data:', xhr.statusText);
                }
            };
            xhr.onerror = function (err) {
                reject('Error making request:', err);
            };
            xhr.send();
        });
    }

    // Function to get new rolls not already processed
    function getNewRolls(fetchedRolls) {
        const existingIds = new Set(pastRolls.map(roll => roll.id));
        const newRolls = fetchedRolls.filter(roll => !existingIds.has(roll.id));
        return newRolls;
    }

    // Function to update the predictions display
    function updatePredictsBox() {
        // Sort the predicts array based on predictTime
        predicts.sort((a, b) => a.predictTime - b.predictTime);
        if (predicts.length >= 23) {
            predicts = predicts.filter(predict => predict.winLoss == "");
        }
        predictsBox.textContent = '';
        predicts.forEach(predict => {
            // Format hours and minutes as HH:MM
            let formattedHour = predict.predictHour.toString().padStart(2, '0');
            let formattedMinute = predict.predictMinute.toString().padStart(2, '0');

            let newPredict = document.createElement("option");
            newPredict.innerText = `${formattedHour}:${formattedMinute} ${predict.predictColor} ${predict.winLoss}`;

            if (predict.winLoss == "WIN" || predict.winLoss == "WIN G1") {
                newPredict.style.backgroundColor = "#2e7d32"; // Darker green
                newPredict.style.color = "#e0f7fa"; // Light cyan
            } else if (predict.winLoss == "BRANCO") {
                newPredict.style.backgroundColor = "#fbc02d"; // Gold for white
                newPredict.style.color = "#212121"; // Dark text for contrast
            } else if (predict.winLoss == "LOSS") {
                newPredict.style.backgroundColor = "#b01d22"; // Dark red
                newPredict.style.color = "#ffffff"; // White text for better contrast
            }

            if (predict.winLoss != "") {
                newPredict.style.fontWeight = "bold";
            }

            predictsBox.appendChild(newPredict);
        });
        predictsBox.scrollTop = predictsBox.scrollHeight;
    }

    // Function to process a current roll and generate predictions
    async function processCurrentRoll(currentRoll) {
        pastRolls.push(currentRoll);

        if (firstA == null) {
            firstA = currentRoll;
            redRed = false;
            blackBlack = false;
        } else if (minB == null) {
            if (
                (firstA.hora == currentRoll.hora && firstA.minuto == currentRoll.minuto && currentRoll.minuto % 10 == 0) ||
                (firstA.cor == "🔴" && currentRoll.cor == "🔴" && firstA.hora == currentRoll.hora && firstA.minuto == currentRoll.minuto)
            ) {
                minA = firstA;
                minB = currentRoll;
                redRed = false;
                blackBlack = false;
            } else if (
                (firstA.cor == "🔴" && currentRoll.cor == "🔴" &&
                    firstA.hora == currentRoll.hora && firstA.minuto != currentRoll.minuto &&
                    firstA.roll != currentRoll.roll)
            ) {
                if (currentRoll.roll > firstA.roll) {
                    maxRoll = currentRoll.roll;
                    minRoll = firstA.roll;
                } else {
                    maxRoll = firstA.roll;
                    minRoll = currentRoll.roll;
                }
                minA = firstA;
                minB = currentRoll;
                redRed = true;
            } else if (
                (firstA.cor == "⚫" && currentRoll.cor == "⚫" &&
                    firstA.hora == currentRoll.hora && firstA.minuto != currentRoll.minuto &&
                    firstA.roll != currentRoll.roll)
            ) {
                if (currentRoll.roll > firstA.roll) {
                    maxRoll = currentRoll.roll;
                    minRoll = firstA.roll;
                } else {
                    maxRoll = firstA.roll;
                    minRoll = currentRoll.roll;
                }
                minA = firstA;
                minB = currentRoll;
                blackBlack = true;
            } else {
                firstA = currentRoll;
                redRed = false;
                blackBlack = false;
            }
        }

        if (minA != null && minB != null) {
            let predictColor;
            let predictTime;
            let predictMinutesAdd;
            let predictHour;
            let predictMinute;

            const colorCombo = `${minA.cor}-${minB.cor}`;

            // Handle the case where both colors are white
            if (colorCombo === "⚪-⚪") {
                // No prediction should be made
                minA = null;
                minB = null;
                // Reset firstA to currentRoll after processing
                firstA = currentRoll;
                redRed = false;
                blackBlack = false;
                return; // Skip making a prediction
            }

            switch (colorCombo) {
                case "🔴-🔴":
                    predictColor = "🔴⚪";
                    break;
                case "⚫-⚫":
                    predictColor = "⚫⚪";
                    break;
                case "🔴-⚫":
                    predictColor = "🔴⚪";
                    break;
                case "⚫-🔴":
                    predictColor = "⚫⚪";
                    break;
                case "🔴-⚪":
                    predictColor = "⚫⚪";
                    break;
                case "⚫-⚪":
                    predictColor = "🔴⚪";
                    break;
                case "⚪-🔴":
                    predictColor = "🔴⚪";
                    break;
                case "⚪-⚫":
                    predictColor = "⚫⚪";
                    break;
                default:
                    predictColor = "Unknown";
                    break;
            }

            if (predictColor === "Unknown") {
                // No prediction should be made
                minA = null;
                minB = null;
                firstA = currentRoll;
                redRed = false;
                blackBlack = false;
                return; // Skip making a prediction
            }

            if (redRed || blackBlack) {
                predictMinutesAdd = maxRoll - minRoll;
            } else {
                predictMinutesAdd = minA.roll + minB.roll;
            }
            predictTime = new Date(minB.horaMinuto);
            predictTime.setUTCMinutes(predictTime.getUTCMinutes() + predictMinutesAdd);
            predictHour = predictTime.getUTCHours();
            predictMinute = predictTime.getUTCMinutes();

            // Save minA and minB before nullifying
            let savedMinA = minA;
            let savedMinB = minB;
            minA = null;
            minB = null;
            // Reset firstA to currentRoll after generating a prediction
            firstA = currentRoll;
            redRed = false;
            blackBlack = false;

            // Create the prediction object
            let prediction = {
                predictHour: predictHour,
                predictMinute: predictMinute,
                predictColor: predictColor,
                predictTime: predictTime,
                winLoss: "", // initial value
                minA: savedMinA,
                minB: savedMinB,
                rollsChecked: 0,
                firstRollResult: null,
                secondRollResult: null
            };

            // Check for duplicates in the predicts array
            let duplicate = predicts.some(p =>
                p.predictHour === predictHour &&
                p.predictMinute === predictMinute &&
                p.predictColor === predictColor
            );

            if (duplicate) {
                // Duplicate prediction found, do not add it
                return;
            } else {
                // Return the new prediction
                return prediction;
            }
        }
    }

    // Function to check predictions against the current roll
    function checkPredictions(currentRoll) {
        for (let predict of predicts) {
            if (predict.winLoss == "") {
                if (currentRoll.hora == predict.predictHour && currentRoll.minuto == predict.predictMinute) {
                    // This roll is within the prediction minute
                    predict.rollsChecked += 1;

                    if (predict.rollsChecked == 1) {
                        // First roll
                        if (currentRoll.cor == "⚪") {
                            predict.firstRollResult = "BRANCO";
                            predict.winLoss = "BRANCO"; // First roll is white
                        } else if (predict.predictColor.includes(currentRoll.cor)) {
                            // Prediction matched
                            predict.firstRollResult = "WIN";
                            predict.winLoss = "WIN"; // Win on first roll
                        } else {
                            predict.firstRollResult = "LOSS";
                            // Wait for second roll
                        }
                    } else if (predict.rollsChecked == 2) {
                        // Second roll
                        if (currentRoll.cor == "⚪") {
                            predict.secondRollResult = "BRANCO";
                            predict.winLoss = "BRANCO";
                        } else if (predict.predictColor.includes(currentRoll.cor)) {
                            // Prediction matched
                            predict.secondRollResult = "WIN";
                            if (predict.winLoss !== "WIN") {
                                predict.winLoss = "WIN G1"; // Win on second roll only
                            }
                        } else {
                            // Prediction did not match
                            predict.secondRollResult = "LOSS";
                            if (predict.winLoss === "") {
                                predict.winLoss = "LOSS"; // Loss on both rolls
                            }
                        }
                    }

                    // After checking both rolls, if winLoss is still "", set it to "LOSS"
                    if (predict.rollsChecked == 2 && predict.winLoss == "") {
                        predict.winLoss = "LOSS";
                    }
                }
            }
        }
    }

    // Initialize the script only after F9 is pressed
    async function init() {
        const element = document.createElement('div');
        element.innerHTML = `
            <div id="draggable" style="min-width: 13%; position: fixed; top: 5px; right: 5px; z-index: 9999; width: auto; height: 90%; display: flex; flex-direction: column; padding: 13px; border: 1px solid #424242; background-color: #121212; color: #e0e0e0; border-radius: 10px; background-size: auto 100%;">
                <div id="handle" style="cursor: move; background-color: #424242; height: 10px; border-radius: 5px;"></div>
                <div style="font-weight: bolder;"><br>TÍTULO AQUI</div>
                <div id="checkerLogo" style="height: 25%;background-position: center;background-size: 90%;background-repeat: no-repeat;"></div>
                <div><a href="https://linktr.ee/00dablaze14x" style="font-weight: bolder;color: white;">@00dablaze14x</a></div>
                <select id="predictsBox" multiple style="flex: 1; overflow-y: auto; background-color: #131212e0; color: #e0e0e0; border: 1px solid #424242; border-radius: 5px;"></select>
            </div>
        `;
        document.body.appendChild(element);
        document.getElementById('checkerLogo').style.backgroundImage = `url("data:image/png;base64,...`;
        document.getElementById('draggable').style.backgroundImage = `url("data:image/png;base64,...`;

        // Get the predictsBox element after it's appended to the DOM
        predictsBox = document.getElementById("predictsBox");

        // Draggable functionality
        const handle = document.getElementById('handle');
        const draggable = document.getElementById('draggable');
        let isDragging = false;

        handle.addEventListener('mousedown', function (e) {
            isDragging = true;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', function () {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
            });
        });

        function onMouseMove(e) {
            if (isDragging) {
                draggable.style.right = `${window.innerWidth - e.clientX}px`;
            }
        }

        // Fetch initial data
        const rolls = await fetchRouletteHistory();
        for (const roll of rolls.reverse()) {
            let result = await processCurrentRoll(roll);
            if (result) {
                predicts.push(result);
            }
        }

        // Remove predictions that are before current time
        const now = new Date();
        now.setUTCHours(now.getUTCHours() - 3); // Adjust time to your local timezone
        predicts = predicts.filter(predict => predict.predictTime >= now);

        // After processing, update the predictsBox
        updatePredictsBox();

        // Mutation Observer callback
        const observer = new MutationObserver(async (mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Check the added/removed nodes and apply further filters if needed
                    if (mutation.addedNodes.length > 0) {
                        try {
                            const fetchedRolls = await fetchRouletteHistory();
                            const newRolls = getNewRolls(fetchedRolls);
                            // Process new rolls from oldest to newest
                            for (const roll of newRolls.reverse()) {
                                let result = await processCurrentRoll(roll);
                                if (result) {
                                    predicts.push(result);
                                }
                                // Check predictions with the current roll
                                checkPredictions(roll);
                            }
                            // Update the displays
                            updatePredictsBox();
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            }
        });

        const config = {
            childList: true,
            attributes: false,
            subtree: true
        };

        // Start observing after ensuring the DOM elements are in place
        const entriesMain = document.getElementsByClassName("entries main")[0];
        if (entriesMain) {
            observer.observe(entriesMain, config);
        } else {
            console.error("entries main not found in the DOM.");
        }
    }

    // Wait for the user to press F9 to run the script
    window.addEventListener('keydown', function (event) {
        if (event.key === 'F9') {
            init();  // Start the script when F9 is pressed
        }
    });
})();
