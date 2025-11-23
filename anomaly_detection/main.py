from anomalib.models import Patchcore
from anomalib.engine import Engine
from anomalib.data import Folder
from anomalib.deploy import ExportType
from anomalib.engine import Engine
from anomalib.models import Patchcore, EfficientAd
from anomalib.data.utils.split import ValSplitMode
from anomalib.data import RealIAD
from anomalib.models.image.padim import Padim

datamodule = RealIAD(
    root="./realiad",
    category="phone_battery",
    resolution="1024",
    train_batch_size=16,
    val_split_mode=ValSplitMode.FROM_TEST,
)

datamodule.setup()


model = Patchcore()


engine = Engine(
    max_epochs=1,  # Patch core only supports 1 epoch
)


engine.fit(datamodule=datamodule, model=model)

test_results = engine.test(datamodule=datamodule, model=model)

engine.export(
    model=model,
    export_type=ExportType.TORCH,
)
