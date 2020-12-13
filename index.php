<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
	<script src="http://maps.googleapis.com/maps/api/js?libraries=geometry&sensor=false" type="text/javascript"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" crossorigin="anonymous"></script>

	<link rel="stylesheet" href="css/style.css">
	<script src="js/script.js"></script>
</head>
<body>
	<div class="content-wrapper">
		<div class="button-wrapper">
			<button id="go-up" disabled="disabled" onclick="go('up')">Go Up</button>
			<!-- <button id="go-down"  onclick="go('down')">Go Down</button> -->
		</div>

		<div class="mapTooltipInfo disable" id="mapTooltipInfo" style="margin-top: -3px; top: 6px; left: 605px;">
		</div>
		<div id="map-canvas" style="height: 700px; min-width: 800px">
		</div>
	</div>
</body>
</html>


