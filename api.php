<?php 
require_once "vendor/autoload.php";
use Dotenv\Dotenv;

class LocationDB {

	public $mysqlInstance;
	public $queryProperties;
	public $mapProperties;

	function __construct() {
		$dotenv = Dotenv::createImmutable(__DIR__);
		$dotenv->load();
		$dotenv->required(['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USERNAME', 'MYSQL_PASSWORD']);

		$this->mysqlInstance = new mysqli($_ENV["MYSQL_HOST"], $_ENV["MYSQL_USERNAME"], $_ENV["MYSQL_PASSWORD"], $_ENV["MYSQL_DATABASE"]);
		$this->mysqlInstance->set_charset("utf8");
		if ($this->mysqlInstance->connect_errno) {
			echo "Failed to connect to MySQL: " . $this->mysqlInstance->connect_error;
			exit();
		}
		$this->getParameters();
	}

	function getFromDB($query){
		$result = $this->mysqlInstance->query($query);
		$res = $result->fetch_all(MYSQLI_ASSOC);
		$result->free_result();
		return $res;
	}

	function getParameters(){
		$type = !empty($_GET["viewtype"]) ? $this->mysqlInstance->real_escape_string($_GET["viewtype"]) : "quarter";

		//Get by default, if tpye is none of the below, it will be set to 3 by default to all country.
		$this->queryProperties["primaryValue"] = $this->mysqlInstance->real_escape_string($_GET["id"]) ?? -1;

		if(!empty($_GET["viewtype"])){
			switch ($type) {
				case 'town':
					$this->queryProperties["table"] = "towns";
					$this->queryProperties["primaryKey"] = "cityId";
					$this->mapProperties["zoom"] = 8;
					$this->mapProperties["type"] = "town";
					$this->mapProperties["coordinates"] = ["lng" => 34.6240119934082, "lat" => 36.80415725708008];
					break;
				case 'quarter':
					$this->queryProperties["table"] = "quarters";
					$this->queryProperties["primaryKey"] = "townId";
					$this->mapProperties["zoom"] = 10;
					$this->mapProperties["type"] = "quarter";
					$this->queryProperties["centerLookupQuery"] = "SELECT centroid from towns where id = ". $this->queryProperties["primaryValue"];
					break;
				case 'city':
					$this->queryProperties["table"] = "cities";
					$this->queryProperties["primaryKey"] = "id";
					$this->mapProperties["zoom"] = 8;
					$this->mapProperties["type"] = "city";
					$this->queryProperties["centerLookupQuery"] = "SELECT centroid from cities where id = " . $this->queryProperties["primaryValue"];
					break;
				default:
					$this->queryProperties["table"] = "cities";
					$this->queryProperties["primaryKey"] = "geoRegionId";
					$this->queryProperties["primaryValue"] = 3;
					$this->mapProperties["zoom"] = 8;
					$this->mapProperties["type"] = "city";
					$this->mapProperties["coordinates"] = ["lng" => 34.6240119934082, "lat" => 36.80415725708008];
					break;
			}
		} else {
			$this->queryProperties["table"] = "cities";
			$this->queryProperties["primaryKey"] = "geoRegionId";
			$this->queryProperties["primaryValue"] = 3;
			$this->mapProperties["zoom"] = 7;
			$this->mapProperties["type"] = "city";
			$this->mapProperties["coordinates"] = ["lng" => 34.6240119934082, "lat" => 36.80415725708008];
		}
	}

	function fetchResult() {
		$primaryKey = $this->queryProperties["primaryKey"]; 
		$primaryValue = $this->queryProperties["primaryValue"];
		$table = $this->queryProperties["table"];
		$sql = "SELECT * FROM $table where $primaryKey = $primaryValue";
		$result = $this->getFromDB($sql);

		if(empty($result)){
			throw new Exception("No town found");
		}

		return $result;
	}

	function prepareResult() {
		// getting proper result with request parameters
		$result = $this->fetchResult();

		

		// decode all json fields
		$jsonFields = ["polygons", "boundingBox", "centroid"];
		foreach($result as &$res){
			foreach($jsonFields as $jsonField) {
				if(isset($res[$jsonField])){
					$res[$jsonField] = json_decode($res[$jsonField], true);
				}
			}
			$res["type"] = $this->mapProperties["type"];
		}

		
		// set center of the map if there is centerLookup query available
		if(isset($this->queryProperties["centerLookupQuery"])){
			$centerPointResult = $this->getFromDB($this->queryProperties["centerLookupQuery"]);
			if(empty($centerPointResult))  
				$this->mapProperties["coordinates"] = ["lng" => 34.6240119934082, "lat" => 36.80415725708008];
			else{
				$centerPointResult = json_decode($centerPointResult[0]["centroid"], true);
				$this->mapProperties["coordinates"] = [
					"lng" => $centerPointResult[0] ?? 34.6240119934082, 
					"lat" => $centerPointResult[1] ?? 36.80415725708008
				];
			}
		}
		 // closing database conenction since it is not needed
		$this->mysqlInstance->close();

		echo json_encode([
			"result" => $result, 
			"mapProps" => [
				"zoom" => $this->mapProperties["zoom"], 
				"centeroid" => $this->mapProperties["coordinates"]
			]
		]);
	}
}

header("Content-Type: application/json");
$instance = new LocationDB();
$instance->prepareResult();


